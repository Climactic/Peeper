<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Concerns\HasUlid;

class DatabaseConnection extends Model
{
    use HasUlid;

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
        'user_id',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
