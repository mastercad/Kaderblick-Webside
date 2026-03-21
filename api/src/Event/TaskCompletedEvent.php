<?php

namespace App\Event;

use App\Entity\Task;
use App\Entity\User;

/**
 * Fired when a user marks a task as completed.
 */
final class TaskCompletedEvent
{
    public function __construct(
        private User $user,
        private Task $task,
    ) {
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getTask(): Task
    {
        return $this->task;
    }
}
