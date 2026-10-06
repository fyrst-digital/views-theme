<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupCollection;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Configurator — switch target and selected seed; Twig composes groups.
 */
#[AsTwigComponent]
class Configurator
{
    public mixed $product = null;

    public mixed $configuratorSettings = null;

    public ?string $elementId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public string $configuratorId = '';

    public string $parentId = '';

    /**
     * Current variant selection, group id => option id. Client store seed.
     *
     * @var array<string, string>
     */
    public array $selected = [];

    public ?string $switchUrl = null;

    public function __construct(
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $elementId = $this->elementId !== null && $this->elementId !== '' ? $this->elementId : null;

        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $parentId = $this->product->getParentId();
        if ($parentId === null || $parentId === '') {
            return;
        }

        $groups = $this->groups();
        if ($groups === []) {
            return;
        }

        $this->visible = true;
        $this->parentId = $parentId;
        $this->configuratorId = $elementId ?? $parentId;
        $this->selected = $this->selectedOptions($groups, $this->product->getOptionIds() ?? []);
        $this->switchUrl = $this->urlGenerator->generate(
            'frontend.detail.switch',
            ['productId' => $parentId],
        );
    }

    /**
     * @return list<PropertyGroupEntity>
     */
    private function groups(): array
    {
        $settings = $this->configuratorSettings;
        if ($settings instanceof PropertyGroupCollection) {
            return array_values($settings->getElements());
        }

        if (!\is_iterable($settings)) {
            return [];
        }

        $groups = [];
        foreach ($settings as $group) {
            if ($group instanceof PropertyGroupEntity) {
                $groups[] = $group;
            }
        }

        return $groups;
    }

    /**
     * @param list<PropertyGroupEntity> $groups
     * @param array<string>            $optionIds
     *
     * @return array<string, string>
     */
    private function selectedOptions(array $groups, array $optionIds): array
    {
        $selected = [];
        foreach ($groups as $group) {
            $options = $group->getOptions();
            if ($options === null) {
                continue;
            }

            foreach ($options as $option) {
                if (!$option instanceof PropertyGroupOptionEntity) {
                    continue;
                }

                if (\in_array($option->getId(), $optionIds, true)) {
                    $selected[$group->getId()] = $option->getId();
                    break;
                }
            }
        }

        return $selected;
    }
}
