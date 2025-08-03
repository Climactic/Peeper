<?php

namespace App\Http\Controllers\Projects;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $project = Project::create($request->all());

        return response()->json($project, 201);
    }

    public function show(Project $project)
    {
        $project->load('databaseConnections');

        return Inertia::render('projects/project', [
            'project' => $project,
            'databaseConnections' => $project->databaseConnections,
        ]);
    }
}
