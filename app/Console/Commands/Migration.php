<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class Migration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'start:migration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the migrations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->call('migrate', ['--force' => true]);
    }
}
