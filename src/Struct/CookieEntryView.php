<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Struct;

/**
 * One switchable cookie of a CookieGroupView (a visible core `CookieEntry`).
 *
 * `name` and `description` are already translated by the core cookie provider.
 */
final readonly class CookieEntryView
{
    public function __construct(
        public string $id,
        public string $cookie,
        public string $name,
        public ?string $description = null,
    ) {
    }
}
