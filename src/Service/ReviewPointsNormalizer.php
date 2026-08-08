<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Symfony\Component\HttpFoundation\InputBag;
use Symfony\Component\HttpFoundation\Request;

/**
 * Core ProductReviewLoader only applies points filters when the value is a list.
 * URL SoT may send a scalar (`points=5`) or pipe-joined values — normalize the
 * **query** bag only. Never touch the request body: save expects scalar `points`.
 */
final class ReviewPointsNormalizer
{
    public function normalize(Request $request): void
    {
        $this->normalizeBag($request->query);
    }

    private function normalizeBag(InputBag $bag): void
    {
        if (!$bag->has('points')) {
            return;
        }

        $raw = $bag->all()['points'];
        $points = self::toList($raw);

        if ($points === []) {
            $bag->remove('points');

            return;
        }

        $bag->set('points', $points);
    }

    /**
     * Normalize raw request `points` (scalar, list, or pipe-joined) to a string list.
     *
     * @return list<string>
     */
    public static function toList(mixed $raw): array
    {
        if (\is_array($raw)) {
            return array_values(array_map(
                static fn ($v) => (string) $v,
                array_filter($raw, static fn ($v) => $v !== null && $v !== ''),
            ));
        }

        if (\is_int($raw) || \is_float($raw)) {
            return [(string) $raw];
        }

        if (!\is_string($raw) || $raw === '') {
            return [];
        }

        if (str_contains($raw, '|')) {
            return array_values(array_filter(
                array_map(static fn (string $v) => trim($v), explode('|', $raw)),
                static fn (string $v) => $v !== '',
            ));
        }

        return [$raw];
    }
}
