<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

/**
 * One segment on Checkout:Title. `icon` is a `vi_icon` name.
 */
final readonly class CheckoutTitleMeta
{
    public function __construct(
        public string $label,
        public ?string $icon = null,
    ) {
    }
}
