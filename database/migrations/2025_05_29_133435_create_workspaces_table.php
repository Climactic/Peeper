<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('owner_id')->constrained('users', 'id');
            $table->string('name');
            $table->string('slug')->unique();
            $table->longText('logo')->nullable();
            $table->string('timezone')->default('UTC');
            $table->timestamps();

            $table->index(['owner_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignUlid('current_workspace_id')->nullable()->constrained('workspaces');
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->text('name')->primary();
            $table->timestamps();
        });

        Schema::create('workspace_memberships', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('workspace_id')->constrained('workspaces');
            $table->foreignUlid('user_id')->constrained('users');
            $table->text('role');
            $table->foreign('role')->references('name')->on('roles');
            $table->timestamps();

            $table->index(['workspace_id', 'user_id', 'role']);
        });

        Schema::table('database_connections', function (Blueprint $table) {
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            if (Schema::hasColumn('database_connections', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });

        DB::table('roles')->insert([
            ['name' => 'owner'],
            ['name' => 'admin'],
            ['name' => 'member'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workspaces');
        Schema::dropIfExists('workspace_memberships');
        Schema::dropIfExists('roles');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('current_workspace_id');
        });
        Schema::table('database_connections', function (Blueprint $table) {
            $table->dropColumn('workspace_id');
            $table->foreignUlid('user_id')->constrained('users');
        });
    }
};
