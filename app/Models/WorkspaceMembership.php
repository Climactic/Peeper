<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Concerns\HasUlid;

class WorkspaceMembership extends Model
{
    use HasUlid;

    protected $fillable = [
        'workspace_id',
        'user_id',
        'role',
    ];

    protected $appends = [
        'permissions',
    ];

    // Relationships
    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    // Accessors
    public function getPermissionsAttribute()
    {
        return config('teams.roles.' . strtolower($this->role) . '.permissions', []);
    }

    public function isOwner()
    {
        return $this->role === 'owner';
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isMember()
    {
        return $this->role === 'member';
    }
}
