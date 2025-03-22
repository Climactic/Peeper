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
            $table->id();
            $table->foreignIdFor(DatabaseConnection::class)->constrained()->cascadeOnDelete();
            $table->string('query');
            $table->enum('executor', ['user', 'system']);
            $table->foreignIdFor(User::class, 'executor_id')->nullable()->constrained()->cascadeOnDelete();
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
