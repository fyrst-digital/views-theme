<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Checkout;

use Fyrst\ViewsTheme\Struct\CheckoutTitleMeta;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Checkout:Title. Twig composes the heading, description block, and meta line.
 */
#[AsTwigComponent]
class Title
{
    public string $heading = '';

    /**
     * @var array<string, CheckoutTitleMeta>
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
            if ($item instanceof CheckoutTitleMeta) {
                $entry = $item;
            } elseif (\is_array($item)) {
                $label = trim((string) ($item['label'] ?? ''));
                if ($label === '') {
                    continue;
                }

                $icon = $item['icon'] ?? null;
                $entry = new CheckoutTitleMeta(
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
