<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Configurator;

use Fyrst\ViewsTheme\Struct\ConfiguratorOptionFace;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Configurator:Option — radio shell. The label face is text, color, or media.
 */
#[AsTwigComponent]
class Option
{
    public mixed $option = null;

    public mixed $group = null;

    public mixed $product = null;

    public ?string $elementId = null;

    public ?string $configuratorId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $optionId = '';

    public string $groupId = '';

    public string $identifier = '';

    public bool $active = false;

    public bool $combinable = true;

    public ?ConfiguratorOptionFace $face = null;

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->option instanceof PropertyGroupOptionEntity || !$this->group instanceof PropertyGroupEntity) {
            return;
        }

        $this->optionId = $this->option->getId();
        $this->groupId = $this->group->getId();
        $this->identifier = $this->identifier($this->groupId, $this->optionId, $this->elementId);
        $this->combinable = $this->option->getCombinable();
        $this->active = \in_array($this->optionId, $this->optionIds(), true);
        $this->face = ConfiguratorOptionFace::from($this->option, $this->group);
    }

    /**
     * @return array<string>
     */
    private function optionIds(): array
    {
        if (!$this->product instanceof SalesChannelProductEntity) {
            return [];
        }

        return $this->product->getOptionIds() ?? [];
    }

    private function identifier(string $groupId, string $optionId, ?string $elementId): string
    {
        $parts = [$groupId, $optionId];
        if ($elementId !== null && $elementId !== '') {
            $parts[] = $elementId;
        }

        return implode('-', $parts);
    }
}
