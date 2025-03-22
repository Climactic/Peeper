<?php

use App\Http\Controllers\Postgres\PostgresConnectionController;
use App\Http\Controllers\Postgres\PostgresQueryController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Postgres Routes
    Route::get('/postgres', [PostgresConnectionController::class, 'index'])->name('postgres.index');
    Route::post('/postgres', [PostgresConnectionController::class, 'store'])->name('postgres.store');
    Route::get('/postgres/{connection:ulid}', [PostgresConnectionController::class, 'explore'])->name('postgres.explore');
    Route::post('/postgres/test-connection', [PostgresConnectionController::class, 'testConnection'])->name('postgres.test-connection');

    // Postgres Explorer API Routes
    Route::get('/postgres/{connection:ulid}/{database}/schemas', [PostgresConnectionController::class, 'getSchemas'])->name('postgres.schemas');
    Route::get('/postgres/{connection:ulid}/{database}/tables', [PostgresConnectionController::class, 'getTables'])->name('postgres.tables');
    Route::get('/postgres/{connection:ulid}/{database}/{table}/columns', [PostgresConnectionController::class, 'getColumns'])->name('postgres.columns');
    Route::get('/postgres/{connection:ulid}/{database}/{table}/data', [PostgresConnectionController::class, 'getTableData'])->name('postgres.data');
    Route::post('/postgres/{connection:ulid}/insert-row', [PostgresConnectionController::class, 'insertRow'])->name('postgres.insert-row');

    // Postgres Query Routes
    Route::get('/postgres/{connection:ulid}/list', [PostgresQueryController::class, 'list'])->name('postgres.queries.list');
    Route::post('/postgres/query/execute', [PostgresQueryController::class, 'executeQuery'])->name('postgres.query.execute');
    Route::get('/postgres/{connection:ulid}/{database}/history', [PostgresQueryController::class, 'getQueryHistory'])->name('postgres.query.history');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
