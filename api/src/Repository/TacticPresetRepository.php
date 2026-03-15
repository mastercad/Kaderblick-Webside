<?php

namespace App\Repository;

use App\Entity\Club;
use App\Entity\TacticPreset;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TacticPreset>
 */
class TacticPresetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TacticPreset::class);
    }

    // -----------------------------------------------------------------
    // Query helpers
    // -----------------------------------------------------------------

    /**
     * Returns all presets visible to the given user:
     *   1. System presets (always visible)
     *   2. Club presets for any club the user belongs to
     *   3. The user's own personal presets
     *
     * @param Club[] $userClubs
     *
     * @return TacticPreset[]
     */
    public function findVisibleForUser(User $user, array $userClubs = []): array
    {
        $qb = $this->createQueryBuilder('p')
            ->leftJoin('p.club', 'c')
            ->leftJoin('p.createdBy', 'u');

        // Build OR conditions
        $orParts = ['p.isSystem = :isSystem'];

        // Own personal presets
        $orParts[] = 'p.createdBy = :me';

        // Club presets
        if ([] !== $userClubs) {
            $orParts[] = 'c.id IN (:clubIds)';
        }

        $qb->where(implode(' OR ', $orParts))
            ->setParameter('isSystem', true)
            ->setParameter('me', $user)
            ->orderBy('p.isSystem', 'DESC')
            ->addOrderBy('p.category', 'ASC')
            ->addOrderBy('p.title', 'ASC');

        if ([] !== $userClubs) {
            $clubIds = array_values(array_filter(
                array_map(fn (Club $c) => $c->getId(), $userClubs)
            ));
            $qb->setParameter('clubIds', $clubIds);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Upsert helper used by fixtures (idempotent seeding).
     * Matches on title + isSystem flag to avoid duplicate system presets.
     */
    public function upsert(TacticPreset $preset): TacticPreset
    {
        $existing = $this->findOneBy([
            'title' => $preset->getTitle(),
            'isSystem' => true,
        ]);

        if (null !== $existing) {
            // Update mutable fields so re-running fixtures stays idempotent
            $existing->setCategory($preset->getCategory());
            $existing->setDescription($preset->getDescription());
            $existing->setData($preset->getData());

            return $existing;
        }

        $this->getEntityManager()->persist($preset);

        return $preset;
    }
}
