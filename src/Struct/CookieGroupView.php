<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Struct;

/**
 * One consent group for Cookie:Manager (view-model of a core `CookieGroup`).
 *
 * A group either lists `entries` (the group switch then toggles all of them) or is a cookie itself
 * (`cookie`, no entries). `name` and `description` are already translated by the core cookie provider.
 */
final readonly class CookieGroupView
{
    /**
     * @param list<CookieEntryView> $entries
     */
    public function __construct(
        public string $id,
        public string $name,
        public bool $required,
        public array $entries = [],
        public ?string $description = null,
        public ?string $cookie = null,
    ) {
    }
}
