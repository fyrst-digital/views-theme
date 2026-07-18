<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Twig\Extra\Html\Cva;

/**
 * CVA slot with attribute class extras already bound.
 */
final class ViCvaSlot implements \Stringable
{
    public function __construct(
        private readonly Cva $cva,
        private readonly ?string $extraClass = null,
    ) {
    }

    /**
     * @param array<string, mixed> $recipes
     */
    public function apply(array $recipes = []): string
    {
        return $this->cva->apply($recipes, $this->extraClass);
    }

    public function __toString(): string
    {
        return $this->apply();
    }
}
