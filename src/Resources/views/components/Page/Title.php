<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Page;

use Fyrst\ViewsTheme\Struct\PageTitleMeta;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Page:Title. Twig composes the heading, description block, and meta line.
 */
#[AsTwigComponent]
class Title
{
    public string $heading = '';

    /**
     * @var 'start'|'center'
     */
    public string $align = 'start';

    /**
     * @var array<string, PageTitleMeta>
     */
    public array $meta = [];

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $meta = [];

        foreach ($this->meta as $key => $item) {
            if ($item instanceof PageTitleMeta) {
                $entry = $item;
            } elseif (\is_array($item)) {
                $label = trim((string) ($item['label'] ?? ''));
                if ($label === '') {
                    continue;
                }

                $icon = $item['icon'] ?? null;
                $entry = new PageTitleMeta(
                    $label,
                    \is_string($icon) && $icon !== '' ? $icon : null,
                );
            } else {
                continue;
            }

            if ($entry->label === '') {
                continue;
            }

            $meta[(string) $key] = $entry;
        }

        $this->meta = $meta;
    }
}
