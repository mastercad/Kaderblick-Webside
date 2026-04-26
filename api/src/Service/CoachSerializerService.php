<?php

namespace App\Service;

use App\Entity\Coach;
use App\Entity\CoachClubAssignment;
use App\Entity\CoachLicenseAssignment;
use App\Entity\CoachNationalityAssignment;
use App\Entity\CoachTeamAssignment;
use App\Security\Voter\CoachVoter;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Centralises the serialisation of a Coach to the canonical API shape
 * used by CoachesController::show() and WatchlistController.
 */
class CoachSerializerService
{
    public function __construct(private Security $security)
    {
    }

    /**
     * Returns the full coach data array for the currently authenticated user.
     *
     * @return array<string, mixed>
     */
    public function serializeForCurrentUser(Coach $coach): array
    {
        return [
            'id' => $coach->getId(),
            'firstName' => $coach->getFirstName(),
            'lastName' => $coach->getLastName(),
            'email' => $coach->getEmail(),
            'birthdate' => $coach->getBirthdate()?->format('Y-m-d'),
            'clubAssignments' => $coach->getCoachClubAssignments()
                ->map(fn (CoachClubAssignment $a) => [
                    'id' => $a->getId(),
                    'startDate' => $a->getStartDate()?->format('Y-m-d'),
                    'endDate' => $a->getEndDate()?->format('Y-m-d'),
                    'club' => [
                        'id' => $a->getClub()->getId(),
                        'name' => $a->getClub()->getName(),
                    ],
                ])->toArray(),
            'teamAssignments' => $coach->getCoachTeamAssignments()
                ->map(fn (CoachTeamAssignment $a) => [
                    'id' => $a->getId(),
                    'startDate' => $a->getStartDate()?->format('Y-m-d'),
                    'endDate' => $a->getEndDate()?->format('Y-m-d'),
                    'team' => [
                        'id' => $a->getTeam()->getId(),
                        'name' => $a->getTeam()->getName(),
                        'ageGroup' => [
                            'id' => $a->getTeam()->getAgeGroup()->getId(),
                            'name' => $a->getTeam()->getAgeGroup()->getName(),
                        ],
                        'league' => [
                            'id' => $a->getTeam()->getLeague()->getId(),
                            'name' => $a->getTeam()->getLeague()->getName(),
                        ],
                        'type' => [
                            'id' => $a->getCoachTeamAssignmentType()?->getId(),
                            'name' => $a->getCoachTeamAssignmentType()?->getName(),
                        ],
                    ],
                ])->toArray(),
            'licenseAssignments' => $coach->getCoachLicenseAssignments()
                ->map(fn (CoachLicenseAssignment $a) => [
                    'id' => $a->getId(),
                    'startDate' => $a->getStartDate()?->format('Y-m-d'),
                    'endDate' => $a->getEndDate()?->format('Y-m-d'),
                    'license' => [
                        'id' => $a->getLicense()->getId(),
                        'name' => $a->getLicense()->getName(),
                    ],
                ])->toArray(),
            'nationalityAssignments' => $coach->getCoachNationalityAssignments()
                ->map(fn (CoachNationalityAssignment $a) => [
                    'id' => $a->getId(),
                    'startDate' => $a->getStartDate()?->format('Y-m-d'),
                    'endDate' => $a->getEndDate()?->format('Y-m-d'),
                    'nationality' => [
                        'id' => $a->getNationality()->getId(),
                        'name' => $a->getNationality()->getName(),
                    ],
                ])->toArray(),
            'permissions' => [
                'canView' => $this->security->isGranted(CoachVoter::VIEW, $coach),
                'canEdit' => $this->security->isGranted(CoachVoter::EDIT, $coach),
                'canCreate' => $this->security->isGranted(CoachVoter::CREATE, $coach),
                'canDelete' => $this->security->isGranted(CoachVoter::DELETE, $coach),
            ],
        ];
    }
}
