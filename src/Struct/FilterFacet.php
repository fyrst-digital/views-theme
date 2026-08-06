<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

/**
 * One renderable filter control for Filter:Panel (component name + props for component()).
 */
final readonly class FilterFacet
{
    /**
     * @param array<string, mixed> $props
     */
    public function __construct(
        public string $component,
        public array $props = [],
    ) {
    }
}
