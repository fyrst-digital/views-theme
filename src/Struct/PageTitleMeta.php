<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Struct;

/**
 * One segment on Page:Title. `icon` is a `vi_icon` name.
 */
final readonly class PageTitleMeta
{
    public function __construct(
        public string $label,
        public ?string $icon = null,
    ) {
    }
}
