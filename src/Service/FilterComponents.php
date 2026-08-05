<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

/**
 * UX component names for filter facets (SoT for resolver / applier / payload builder).
 */
final class FilterComponents
{
    public const MULTI_SELECT = 'ViewsTheme:Filter:MultiSelect';

    public const BOOLEAN = 'ViewsTheme:Filter:Boolean';

    public const RATING = 'ViewsTheme:Filter:Rating';

    public const RANGE = 'ViewsTheme:Filter:Range';

    private function __construct()
    {
    }
}
