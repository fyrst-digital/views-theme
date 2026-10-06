<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Configurator;

use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Configurator:Option — display type, media, and selection.
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

    public string $displayType = 'text';

    public mixed $media = null;

    public ?string $colorHex = null;

    public string $name = '';

    public bool $hideName = false;

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
        $this->name = $this->translatedName($this->option);
        $this->combinable = $this->option->getCombinable();
        $this->active = \in_array($this->optionId, $this->optionIds(), true);

        $settingMedia = $this->option->getConfiguratorSetting()?->getMedia();
        if ($settingMedia instanceof MediaEntity) {
            $this->displayType = 'media';
            $this->media = $settingMedia;
        } else {
            $this->displayType = $this->group->getDisplayType();
            $media = $this->option->getMedia();
            $this->media = $media instanceof MediaEntity ? $media : null;
        }

        $colorHex = $this->option->getColorHexCode();
        $this->colorHex = \is_string($colorHex) && $colorHex !== '' ? $colorHex : null;

        $hasMedia = $this->displayType === 'media' && $this->media instanceof MediaEntity;
        $hasColor = $this->displayType === 'color' && $this->colorHex !== null;
        $this->hideName = $hasMedia || $hasColor;
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
