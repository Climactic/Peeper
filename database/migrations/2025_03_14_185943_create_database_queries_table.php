<?php

use App\Models\DatabaseConnection;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('database_queries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('database_connection_id')->constrained('database_connections')->cascadeOnDelete();
            $table->string('query');
            $table->enum('executor', ['user', 'system']);
            $table->foreignUlid('executor_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->json('parameters')->nullable()->comment('JSON encoded parameters required for the query');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('database_queries');
    }
};
