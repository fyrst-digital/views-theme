<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Review;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Review:Rating — star icon list from points; Twig composes.
 */
#[AsTwigComponent]
class Rating
{
    public float|int $points = 0;

    public int $maxPoints = 5;

    public ?string $altText = null;

    public string $size = 'md';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<string>
     */
    public array $starIcons = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $points = (float) $this->points;
        $full = (int) floor($points);
        $frac = round(($points - $full) * 4) / 4;
        $half = $frac > 0 ? 1 : 0;
        $blank = $this->maxPoints - $full - $half;

        $icons = [];

        for ($i = 0; $i < $full; ++$i) {
            $icons[] = 'star-fill';
        }

        if ($half) {
            $icons[] = 'star-half-fill';
        }

        for ($i = 0; $i < $blank; ++$i) {
            $icons[] = 'star';
        }

        $this->starIcons = $icons;
    }
}
