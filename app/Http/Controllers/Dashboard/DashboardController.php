<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $projects = Project::all();

        return Inertia::render('dashboard', [
            'projects' => $projects,
        ]);
    }
}
