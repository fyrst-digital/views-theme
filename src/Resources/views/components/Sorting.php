<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Shopware\Core\Content\Product\SalesChannel\Sorting\ProductSortingCollection;
use Shopware\Core\Content\Product\SalesChannel\Sorting\ProductSortingEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Sorting — maps sortings to Form:Select options; Twig composes shell.
 */
#[AsTwigComponent]
class Sorting
{
    public mixed $current = null;

    public mixed $sortings = [];

    public bool $show = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<array{value: string, label: string}>
     */
    public array $options = [];

    public bool $visible = false;

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->options = $this->mapOptions($this->sortings);
        $this->visible = $this->show && $this->options !== [];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function mapOptions(mixed $sortings): array
    {
        if ($sortings instanceof ProductSortingCollection || $sortings instanceof EntityCollection) {
            $items = $sortings;
        } elseif (is_iterable($sortings)) {
            $items = $sortings;
        } else {
            return [];
        }

        $options = [];

        foreach ($items as $sorting) {
            if ($sorting instanceof ProductSortingEntity) {
                $key = $sorting->getKey();
                $translated = $sorting->getTranslation('label');
                $label = \is_string($translated) && $translated !== ''
                    ? $translated
                    : (string) ($sorting->getLabel() ?? $key);

                $options[] = [
                    'value' => $key,
                    'label' => $label,
                ];

                continue;
            }

            if (\is_array($sorting)) {
                $key = (string) ($sorting['key'] ?? $sorting['value'] ?? '');
                if ($key === '') {
                    continue;
                }

                $options[] = [
                    'value' => $key,
                    'label' => (string) ($sorting['label'] ?? $key),
                ];
            }
        }

        return $options;
    }
}
