<?php

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
        Schema::create('database_connections', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->enum('type', ['postgres', 'mysql']);
            $table->string('name');
            $table->string('host');
            $table->string('port');
            $table->string('username');
            $table->string('password');
            $table->string('database');
            $table->enum('sslmode', ['disable', 'require', 'prefer', 'verify-full', 'verify-ca', 'verify-identity'])->default('disable');
            $table->string('sslcert')->nullable();
            $table->string('sslkey')->nullable();
            $table->string('sslrootcert')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('database_connections');
    }
};
