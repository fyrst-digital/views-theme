<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

/**
 * Caller-controlled slot order and column spans for a fixed grid.
 */
final class FieldGrid
{
    /**
     * @param list<string> $defaultOrder
     *
     * @return list<string>
     */
    public static function order(mixed $order, array $defaultOrder): array
    {
        if (!\is_array($order)) {
            return $defaultOrder;
        }

        $normalized = [];
        foreach ($order as $name) {
            if (!\is_string($name) || !\in_array($name, $defaultOrder, true) || \in_array($name, $normalized, true)) {
                continue;
            }
            $normalized[] = $name;
        }

        return $normalized;
    }

    /**
     * @param array<mixed, mixed> $spans
     * @param array<string, int>  $defaults
     *
     * @return array<string, int>
     */
    public static function spans(array $spans, array $defaults, int $max = 12): array
    {
        $normalized = $defaults;
        foreach ($spans as $name => $span) {
            if (!\is_string($name) || !\array_key_exists($name, $normalized)) {
                continue;
            }
            $value = self::spanValue($span, $max);
            if ($value === null) {
                continue;
            }
            $normalized[$name] = $value;
        }

        return $normalized;
    }

    private static function spanValue(mixed $span, int $max): ?int
    {
        if (\is_int($span)) {
            $value = $span;
        } elseif (\is_string($span) && preg_match('/^[1-9][0-9]*$/', $span) === 1) {
            $value = (int) $span;
        } else {
            return null;
        }

        if ($value < 1 || $value > $max) {
            return null;
        }

        return $value;
    }
}
