<?php

namespace App\Http\Controllers\Postgres;

use App\Http\Controllers\Controller;
use App\Models\DatabaseConnection;
use App\Models\DatabaseQuery;
use App\Services\Databases\PostgresService;
use App\Traits\DatabaseQueryHelper;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostgresQueryController extends Controller
{
    use DatabaseQueryHelper;

    /**
     * @var PostgresService
     */
    protected $postgresService;

    /**
     * Create a new controller instance.
     */
    public function __construct(PostgresService $postgresService)
    {
        $this->postgresService = $postgresService;
    }

    /**
     * Get query history for a specific database connection.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function list(Request $request, DatabaseConnection $connection)
    {
        // Ensure the user can only access their own connections
        if ($connection->workspace_id !== $request->user()->current_workspace_id) {
            return response()->json([], 403);
        }

        $queries = DatabaseQuery::where('database_connection_id', $connection->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($queries);
    }

    /**
     * Execute a custom SQL query for a PostgreSQL database.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function executeQuery(Request $request)
    {
        $request->validate([
            'connection_id' => 'required|string',
            'database' => 'required|string',
            'query' => 'required|string',
        ]);

        try {
            $connection = DatabaseConnection::where('ulid', $request->input('connection_id'))->firstOrFail();

            // Ensure the user can only access their own connections
            if ($connection->workspace_id !== $request->user()->current_workspace_id) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized action.',
                ], 403);
            }

            $database = $request->input('database');
            $query = $request->input('query');

            // Split the query to check if it contains multiple statements
            $statements = $this->splitSqlStatements($query);
            $isMultiStatement = count($statements) > 1;

            // Execute the query
            $result = $this->postgresService->executeQuery($connection, $database, $query);

            // Log the successful query execution
            DatabaseQuery::create([
                'database_connection_id' => $connection->id,
                'query' => $query,
                'executor' => 'user',
                'executor_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'multi_statement' => $isMultiStatement,
                'statements_count' => count($statements),
            ]);
        } catch (QueryException $e) {
            // Extract detailed PostgreSQL error information
            $errorInfo = $e->errorInfo ?? [];
            $sqlState = $errorInfo[0] ?? null;
            $errorCode = $errorInfo[1] ?? null;
            $errorMessage = $e->getMessage();

            // Parse PostgreSQL error message to extract detail and hint
            $detail = null;
            $hint = null;
            $position = null;

            // Try to extract more information from the error message
            if (preg_match('/DETAIL:\s*(.+?)(?:\n|$)/i', $errorMessage, $matches)) {
                $detail = $matches[1];
            }

            if (preg_match('/HINT:\s*(.+?)(?:\n|$)/i', $errorMessage, $matches)) {
                $hint = $matches[1];
            }

            if (preg_match('/Position:\s*(\d+)/i', $errorMessage, $matches)) {
                $position = (int) $matches[1];
            }

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'sqlState' => $sqlState,
                'code' => $errorCode,
                'detail' => $detail,
                'hint' => $hint,
                'position' => $position,
                'query' => $request->input('query'),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'An error occurred: ' . $e->getMessage(),
                'query' => $request->input('query'),
            ], 500);
        }
    }

    /**
     * Get query history for a specific database connection
     *
     * @param  string  $database
     * @return \Illuminate\Http\JsonResponse
     */
    public function getQueryHistory(Request $request, DatabaseConnection $connection, $database)
    {
        // Ensure the user can only access their own connections
        if ($connection->workspace_id !== $request->user()->current_workspace_id) {
            return response()->json([], 403);
        }

        $history = DatabaseQuery::where('database_connection_id', $connection->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($history);
    }
}
