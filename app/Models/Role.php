<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
    ];

    protected $appends = [
        'permissions',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(WorkspaceMembership::class);
    }

    public function getPermissionsAttribute(): array
    {
        return config('workspace.roles.'.strtolower($this->name).'.permissions', []);
    }
}
