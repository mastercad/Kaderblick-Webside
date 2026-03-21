<?php

namespace App\Event;

use App\Entity\Survey;
use App\Entity\User;

/**
 * Fired when a user submits a survey response.
 */
final class SurveyCompletedEvent
{
    public function __construct(
        private User $user,
        private Survey $survey,
    ) {
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getSurvey(): Survey
    {
        return $this->survey;
    }
}
