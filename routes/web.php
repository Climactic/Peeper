<?php

use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Postgres\PostgresConnectionController;
use App\Http\Controllers\Postgres\PostgresQueryController;
use App\Http\Controllers\Projects\ProjectController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Projects Routes
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');

    // Postgres Routes
    Route::get('/postgres', [PostgresConnectionController::class, 'index'])->name('postgres.index');
    Route::post('/postgres', [PostgresConnectionController::class, 'store'])->name('postgres.store');
    Route::get('/postgres/{connection}', [PostgresConnectionController::class, 'explore'])->name('postgres.explore');
    Route::post('/postgres/test-connection', [PostgresConnectionController::class, 'testConnection'])->name('postgres.test-connection');
    Route::get('/postgres/connection-status/{id}', [PostgresConnectionController::class, 'connectionStatus'])->name('postgres.connection-status');

    // Postgres Explorer API Routes
    Route::get('/postgres/{connection}/{database}/schemas', [PostgresConnectionController::class, 'getSchemas'])->name('postgres.schemas');
    Route::get('/postgres/{connection}/{database}/tables', [PostgresConnectionController::class, 'getTables'])->name('postgres.tables');
    Route::get('/postgres/{connection}/{database}/{table}/columns', [PostgresConnectionController::class, 'getColumns'])->name('postgres.columns');
    Route::get('/postgres/{connection}/{database}/{table}/data', [PostgresConnectionController::class, 'getTableData'])->name('postgres.data');
    Route::post('/postgres/{connection}/insert-row', [PostgresConnectionController::class, 'insertRow'])->name('postgres.insert-row');

    // Postgres Query Routes
    Route::get('/postgres/{connection}/list', [PostgresQueryController::class, 'list'])->name('postgres.queries.list');
    Route::post('/postgres/query/execute', [PostgresQueryController::class, 'executeQuery'])->name('postgres.query.execute');
    Route::get('/postgres/{connection}/{database}/history', [PostgresQueryController::class, 'getQueryHistory'])->name('postgres.query.history');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
