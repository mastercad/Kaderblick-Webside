<?php

namespace App\Controller\Api;

use App\Entity\AgeGroup;
use App\Entity\League;
use App\Entity\Team;
use App\Entity\User;
use App\Repository\TeamRepository;
use App\Security\Voter\TeamVoter;
use App\Service\CoachTeamPlayerService;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route(path: '/api/teams', name: 'api_teams_')]
#[IsGranted('IS_AUTHENTICATED')]
class TeamsController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private CoachTeamPlayerService $coachTeamPlayerService
    ) {
    }

    /**
     * Supported contexts via ?context= query parameter:
     *   (none)       – default: only teams the authenticated user is assigned to
     *   match        – all teams; only effective for coaches, admins and superadmins
     *   tournament   – identical to "match"
     * Regular users (e.g. parents) are always filtered to their own teams,
     * regardless of the context parameter.
     */
    #[Route('/list', name: 'api_teams_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        /** @var TeamRepository $teamsRepository */
        $teamsRepository = $this->entityManager->getRepository(Team::class);

        $isAdmin = $this->isGranted('ROLE_ADMIN') || $this->isGranted('ROLE_SUPERADMIN');
        $coachTeamIds = array_keys($this->coachTeamPlayerService->collectCoachTeams($user));
        $isCoach = count($coachTeamIds) > 0;

        // Only coaches, admins and superadmins may bypass the user-assignment filter.
        // Regular users (e.g. parents) must never see all teams just by passing a context.
        $context = $request->query->get('context', '');
        $allTeams = in_array($context, ['match', 'tournament'], true) && ($isAdmin || $isCoach);

        /** @var Team[] $teams */
        $teams = $teamsRepository->fetchOptimizedList($user, $allTeams);

        return $this->json([
            'teams' => array_map(fn ($team) => [
                'id' => $team['id'],
                'name' => $team['name'],
                'ageGroup' => [
                    'id' => $team['age_group_id'],
                    'name' => $team['age_group_name'],
                ],
                'league' => [
                    'id' => $team['league_id'],
                    'name' => $team['league_name'],
                ],
                'defaultHalfDuration' => isset($team['default_half_duration']) ? (int) $team['default_half_duration'] : null,
                'defaultHalftimeBreakDuration' => isset($team['default_halftime_break_duration']) ? (int) $team['default_halftime_break_duration'] : null,
                'permissions' => [
                    'canView' => true,
                    'canEdit' => $isAdmin || in_array($team['id'], $coachTeamIds),
                    'canDelete' => $isAdmin || in_array($team['id'], $coachTeamIds),
                    'canCreate' => $isAdmin,
                ]
            ], $teams)
        ]);
    }

    #[Route('', name: 'api_teams_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, max(1, (int) $request->query->get('limit', 25)));
        $search = trim((string) $request->query->get('search', ''));

        // Season metadata
        $seasonParam = $request->query->get('season');
        $now = new DateTimeImmutable();
        $currentMonth = (int) $now->format('n');
        $currentYear = (int) $now->format('Y');
        $defaultSeasonYear = $currentMonth >= 7 ? $currentYear : ($currentYear - 1);
        $seasonYear = (null !== $seasonParam && ctype_digit((string) $seasonParam))
            ? (int) $seasonParam
            : $defaultSeasonYear;
        $availableSeasons = [];
        for ($y = 2021; $y <= $defaultSeasonYear; ++$y) {
            $availableSeasons[] = $y;
        }

        /** @var User $user */
        $user = $this->getUser();
        /** @var TeamRepository $teamsRepository */
        $teamsRepository = $this->entityManager->getRepository(Team::class);
        $result = $teamsRepository->fetchPaginatedList($user, $search, $page, $limit);

        $isAdmin = $this->isGranted('ROLE_ADMIN', $user) || $this->isGranted('ROLE_SUPERADMIN', $user);
        $coachTeamIds = array_keys($this->coachTeamPlayerService->collectCoachTeams($user));

        return $this->json([
            'teams' => array_map(fn ($team) => [
                'id' => $team['id'],
                'name' => $team['name'],
                'ageGroup' => [
                    'id' => $team['age_group_id'],
                    'name' => $team['age_group_name'],
                ],
                'league' => [
                    'id' => $team['league_id'],
                    'name' => $team['league_name'],
                ],
                'permissions' => [
                    'canView' => true,
                    'canEdit' => $isAdmin || in_array($team['id'], $coachTeamIds),
                    'canDelete' => $isAdmin || in_array($team['id'], $coachTeamIds),
                    'canCreate' => $isAdmin,
                ]
            ], $result['data']),
            'total' => $result['total'],
            'page' => $page,
            'limit' => $limit,
            'availableSeasons' => $availableSeasons,
            'selectedSeason' => $seasonYear,
        ]);
    }

    #[Route('/{id}/details', name: 'api_team_show', methods: ['GET'])]
    public function show(Team $team): JsonResponse
    {
        if (!$this->isGranted(TeamVoter::VIEW, $team)) {
            return $this->json(['error' => 'Zugriff verweigert'], Response::HTTP_FORBIDDEN);
        }

        /** @var User $user */
        $user = $this->getUser();

        return $this->json([
            'team' => [
                'id' => $team->getId(),
                'name' => $team->getName(),
                'ageGroup' => [
                    'id' => $team->getAgeGroup()->getId(),
                    'name' => $team->getAgeGroup()->getName(),
                ],
                'league' => [
                    'id' => $team->getLeague()?->getId(),
                    'name' => $team->getLeague()?->getName(),
                ],
                'defaultHalfDuration' => $team->getDefaultHalfDuration(),
                'defaultHalftimeBreakDuration' => $team->getDefaultHalftimeBreakDuration(),
                'fussballDeId' => $team->getFussballDeId(),
                'fussballDeUrl' => $team->getFussballDeUrl(),
                'permissions' => [
                    'canView' => $this->isGranted(TeamVoter::VIEW, $team),
                    'canEdit' => $this->isGranted(TeamVoter::EDIT, $team),
                    'canDelete' => $this->isGranted(TeamVoter::DELETE, $team),
                    'canCreate' => $this->isGranted(TeamVoter::CREATE, $team)
                ]
            ]
        ]);
    }

    #[Route('/{id}/timing-defaults', name: 'api_team_timing_defaults', methods: ['PATCH'])]
    public function updateTimingDefaults(Team $team, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $isAdmin = $this->isGranted('ROLE_ADMIN') || $this->isGranted('ROLE_SUPERADMIN');
        $coachTeamIds = array_keys($this->coachTeamPlayerService->collectCoachTeams($user));
        $isCoachOfTeam = in_array($team->getId(), $coachTeamIds, true);

        if (!$isAdmin && !$isCoachOfTeam) {
            return $this->json(['error' => 'Zugriff verweigert'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (array_key_exists('defaultHalfDuration', $data)) {
            $val = $data['defaultHalfDuration'];
            $team->setDefaultHalfDuration(null !== $val && '' !== $val ? (int) $val : null);
        }

        if (array_key_exists('defaultHalftimeBreakDuration', $data)) {
            $val = $data['defaultHalftimeBreakDuration'];
            $team->setDefaultHalftimeBreakDuration(null !== $val && '' !== $val ? (int) $val : null);
        }

        $this->entityManager->persist($team);
        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'defaultHalfDuration' => $team->getDefaultHalfDuration(),
            'defaultHalftimeBreakDuration' => $team->getDefaultHalftimeBreakDuration(),
        ]);
    }

    #[Route('/{id}', name: 'api_team_update', methods: ['PUT'])]
    public function update(Team $team, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$this->isGranted(TeamVoter::EDIT, $team)) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $teamData = json_decode($request->getContent(), true);

        $team->setName($teamData['name']);

        if (isset($teamData['ageGroup']['id'])) {
            $ageGroupRepository = $this->entityManager->getRepository(AgeGroup::class);
            $ageGroup = $ageGroupRepository->find($teamData['ageGroup']['id']);
            if ($ageGroup) {
                $team->setAgeGroup($ageGroup);
            }
        }

        if (isset($teamData['league']['id'])) {
            $leagueRepository = $this->entityManager->getRepository(League::class);
            $league = $leagueRepository->find($teamData['league']['id']);
            if ($league) {
                $team->setLeague($league);
            }
        }

        if (array_key_exists('defaultHalfDuration', $teamData)) {
            $val = $teamData['defaultHalfDuration'];
            $team->setDefaultHalfDuration(null !== $val && '' !== $val ? (int) $val : null);
        }

        if (array_key_exists('defaultHalftimeBreakDuration', $teamData)) {
            $val = $teamData['defaultHalftimeBreakDuration'];
            $team->setDefaultHalftimeBreakDuration(null !== $val && '' !== $val ? (int) $val : null);
        }

        $this->entityManager->persist($team);
        $this->entityManager->flush();

        return $this->json(['success' => true]);
    }

    #[Route('', name: 'api_team_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $teamData = json_decode($request->getContent(), true);

        $team = new Team();

        if (!$this->isGranted(TeamVoter::CREATE, $team)) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $team->setName($teamData['name']);

        if (isset($teamData['ageGroup']['id'])) {
            $ageGroupRepository = $this->entityManager->getRepository(AgeGroup::class);
            $ageGroup = $ageGroupRepository->find($teamData['ageGroup']['id']);
            if ($ageGroup) {
                $team->setAgeGroup($ageGroup);
            }
        }

        if (isset($teamData['league']['id'])) {
            $leagueRepository = $this->entityManager->getRepository(League::class);
            $league = $leagueRepository->find($teamData['league']['id']);
            if ($league) {
                $team->setLeague($league);
            }
        }
        $this->entityManager->persist($team);
        $this->entityManager->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/{id}', name: 'api_team_delete', methods: ['DELETE'])]
    public function delete(Team $team): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$this->isGranted(TeamVoter::DELETE, $team)) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($team);
        $this->entityManager->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/{id}/players', name: 'api_team_players', methods: ['GET'])]
    public function players(Team $team): JsonResponse
    {
        $players = $team->getCurrentPlayers();
        $result = [];
        foreach ($players as $player) {
            $shirtNumber = null;
            foreach ($player->getPlayerTeamAssignments() as $pta) {
                if ($pta->getTeam()->getId() === $team->getId()) {
                    $shirtNumber = $pta->getShirtNumber();
                    break;
                }
            }
            $result[] = [
                'id' => $player->getId(),
                'fullName' => $player->getFirstName() . ' ' . $player->getLastName(),
                'shirtNumber' => $shirtNumber,
            ];
        }

        usort($result, static function (array $a, array $b): int {
            if ($a['shirtNumber'] === $b['shirtNumber']) {
                return strcmp((string) $a['fullName'], (string) $b['fullName']);
            }
            if (null === $a['shirtNumber']) {
                return 1;
            }
            if (null === $b['shirtNumber']) {
                return -1;
            }

            return (int) $a['shirtNumber'] <=> (int) $b['shirtNumber'];
        });

        return $this->json($result);
    }
}
