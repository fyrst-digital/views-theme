<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

use Fyrst\ViewsTheme\Service\FilterComponents;

/**
 * One renderable filter control for Filter:Panel.
 *
 * `component` is the UX tag for `component()`. `type` is the stable kind
 * (`FilterFacetType`) consumers branch on.
 */
final readonly class FilterFacet
{
    public string $type;

    /**
     * @param array<string, mixed> $props
     */
    public function __construct(
        public string $component,
        public array $props = [],
        ?string $type = null,
    ) {
        $this->type = $type ?? FilterFacetType::fromComponent($component);
    }

    /**
     * Stable client/server key for batch filter-options (e.g. manufacturer, properties:{groupId}).
     */
    public function key(): ?string
    {
        $props = $this->props;

        if ($this->component === FilterComponents::MULTI_SELECT) {
            $name = (string) ($props['name'] ?? '');
            $propertyName = isset($props['propertyName']) ? (string) $props['propertyName'] : '';
            if ($name === 'properties' && $propertyName !== '') {
                return 'properties:' . $propertyName;
            }
            if ($name !== '') {
                return $name;
            }

            return null;
        }

        if ($this->component === FilterComponents::BOOLEAN) {
            $name = (string) ($props['name'] ?? '');

            return $name !== '' ? $name : null;
        }

        if ($this->component === FilterComponents::RATING) {
            $name = (string) ($props['name'] ?? 'rating');

            return $name !== '' ? $name : null;
        }

        if ($this->component === FilterComponents::RANGE) {
            $key = (string) ($props['filterKey'] ?? 'price');

            return $key !== '' ? $key : null;
        }

        return null;
    }
}
