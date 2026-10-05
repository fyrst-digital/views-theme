<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

use Fyrst\ViewsTheme\Service\FilterComponents;
use InvalidArgumentException;

/**
 * Stable facet kind. Independent of the UX component name.
 */
final class FilterFacetType
{
    public const MULTI_SELECT = 'multi-select';

    public const BOOLEAN = 'boolean';

    public const RATING = 'rating';

    public const RANGE = 'range';

    public static function fromComponent(string $component): string
    {
        return match ($component) {
            FilterComponents::MULTI_SELECT => self::MULTI_SELECT,
            FilterComponents::BOOLEAN => self::BOOLEAN,
            FilterComponents::RATING => self::RATING,
            FilterComponents::RANGE => self::RANGE,
            default => throw new InvalidArgumentException(sprintf(
                'Unknown filter component "%s". Pass an explicit FilterFacet type.',
                $component,
            )),
        };
    }

    private function __construct()
    {
    }
}
