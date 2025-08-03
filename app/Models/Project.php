<?php

namespace App\Models;

use App\Concerns\HasUlid;
use App\Concerns\HasWorkspaceScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasUlid, HasWorkspaceScope;

    protected $fillable = [
        'workspace_id',
        'name',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function databaseConnections(): HasMany
    {
        return $this->hasMany(DatabaseConnection::class);
    }
}
