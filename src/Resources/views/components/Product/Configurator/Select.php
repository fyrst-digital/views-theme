<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Configurator;

use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Configurator:Select — dropdown choices for one group.
 */
#[AsTwigComponent]
class Select
{
    public mixed $group = null;

    public mixed $product = null;

    public ?string $elementId = null;

    public ?string $configuratorId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $groupId = '';

    public string $groupName = '';

    public string $controlId = '';

    /**
     * @var list<array{value: string, name: string, selected: bool, combinable: bool}>
     */
    public array $choices = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->group instanceof PropertyGroupEntity) {
            return;
        }

        $this->groupId = $this->group->getId();
        $this->groupName = $this->translatedName($this->group);
        $this->controlId = $this->controlId($this->groupId, $this->elementId);

        $optionIds = [];
        if ($this->product instanceof SalesChannelProductEntity) {
            $optionIds = $this->product->getOptionIds() ?? [];
        }

        $options = $this->group->getOptions();
        if ($options === null) {
            return;
        }

        foreach ($options as $option) {
            if (!$option instanceof PropertyGroupOptionEntity) {
                continue;
            }

            $this->choices[] = [
                'value' => $option->getId(),
                'name' => $this->translatedName($option),
                'selected' => \in_array($option->getId(), $optionIds, true),
                'combinable' => $option->getCombinable(),
            ];
        }
    }

    private function controlId(string $groupId, ?string $elementId): string
    {
        if ($elementId !== null && $elementId !== '') {
            return $groupId . '-' . $elementId;
        }

        return $groupId;
    }

    private function translatedName(Entity $entity): string
    {
        $translated = $entity->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        $name = $entity->get('name');

        return \is_string($name) ? $name : '';
    }
}
