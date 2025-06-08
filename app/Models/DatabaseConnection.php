<?php

namespace App\Models;

use App\Concerns\HasUlid;
use App\Concerns\HasWorkspaceScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DatabaseConnection extends Model
{
    use HasUlid, HasWorkspaceScope;

    protected $fillable = [
        'name',
        'type',
        'host',
        'port',
        'username',
        'password',
        'database',
        'sslmode',
        'sslcert',
        'sslkey',
        'sslrootcert',
        'metadata',
        'workspace_id',
    ];

    protected $casts = [
        'host' => 'encrypted',
        'port' => 'encrypted',
        'username' => 'encrypted',
        'password' => 'encrypted',
        'database' => 'encrypted',
        'sslcert' => 'encrypted',
        'sslkey' => 'encrypted',
        'sslrootcert' => 'encrypted',
        'metadata' => 'array',
    ];

    protected $hidden = [
        'password',
        'sslcert',
        'sslkey',
        'sslrootcert',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
