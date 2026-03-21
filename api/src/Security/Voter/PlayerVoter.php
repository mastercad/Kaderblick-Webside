<?php

namespace App\Security\Voter;

use App\Entity\Player;
use App\Entity\User;
use App\Service\CoachTeamPlayerService;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @template-extends Voter<string, Player>
 */
final class PlayerVoter extends Voter
{
    public const CREATE = 'POST_CREATE';
    public const EDIT = 'POST_EDIT';
    public const VIEW = 'POST_VIEW';
    public const DELETE = 'POST_DELETE';

    public function __construct(private readonly CoachTeamPlayerService $coachTeamPlayerService)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::CREATE, self::EDIT, self::VIEW, self::DELETE])
            && $subject instanceof Player;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        /** @var ?User $user */
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        switch ($attribute) {
            case self::CREATE:
            case self::EDIT:
            case self::DELETE:
                // SUPERADMIN und ADMIN dürfen immer
                if (
                    in_array('ROLE_SUPERADMIN', $user->getRoles())
                    || in_array('ROLE_ADMIN', $user->getRoles())
                ) {
                    return true;
                }

                // Coach darf Spieler verwalten, die seinen aktiven Teams zugeordnet sind
                $coachTeams = $this->coachTeamPlayerService->collectCoachTeams($user);

                if (0 === count($coachTeams)) {
                    break;
                }

                if (self::CREATE === $attribute) {
                    // Neuer Spieler hat noch kein Team – jeder aktive Coach darf anlegen
                    return true;
                }

                foreach ($subject->getPlayerTeamAssignments() as $pta) {
                    if (isset($coachTeams[$pta->getTeam()->getId()])) {
                        return true;
                    }
                }

                break;
            case self::VIEW:
                return true;
        }

        return false;
    }
}
