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
            $table->foreignUlid('owner_id')->constrained('users', 'id')->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->longText('logo')->nullable();
            $table->string('timezone')->default('UTC');
            $table->timestamps();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->text('name')->primary();
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
        Schema::dropIfExists('workspace_memberships');
        Schema::dropIfExists('workspaces');
        Schema::dropIfExists('roles');
    }
};
