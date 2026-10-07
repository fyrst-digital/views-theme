<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;

/**
 * How one configurator option is drawn inside the radio label.
 *
 * Setting media wins. Otherwise the group display type is used.
 * Legacy `image`, empty, and unknown types are text.
 */
final readonly class ConfiguratorOptionFace
{
    public const TEXT = 'text';

    public const COLOR = 'color';

    public const MEDIA = 'media';

    public function __construct(
        public string $kind,
        public string $name,
        public ?string $colorHex = null,
        public ?MediaEntity $media = null,
    ) {
    }

    public static function from(PropertyGroupOptionEntity $option, PropertyGroupEntity $group): self
    {
        $name = self::translatedName($option);
        $settingMedia = $option->getConfiguratorSetting()?->getMedia();

        if ($settingMedia instanceof MediaEntity) {
            return new self(self::MEDIA, $name, null, $settingMedia);
        }

        $type = self::normalize($group->getDisplayType());
        if ($type === self::MEDIA) {
            $media = $option->getMedia();

            return new self(self::MEDIA, $name, null, $media instanceof MediaEntity ? $media : null);
        }

        if ($type === self::COLOR) {
            $colorHex = $option->getColorHexCode();
            $colorHex = \is_string($colorHex) && $colorHex !== '' ? $colorHex : null;

            return new self(self::COLOR, $name, $colorHex, null);
        }

        return new self(self::TEXT, $name);
    }

    public function hidesName(): bool
    {
        if ($this->kind === self::COLOR) {
            return $this->colorHex !== null;
        }

        if ($this->kind === self::MEDIA) {
            return $this->media instanceof MediaEntity;
        }

        return false;
    }

    private static function normalize(?string $displayType): string
    {
        return match ($displayType) {
            self::COLOR, self::MEDIA => $displayType,
            default => self::TEXT,
        };
    }

    private static function translatedName(Entity $entity): string
    {
        $translated = $entity->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        $name = $entity->get('name');

        return \is_string($name) ? $name : '';
    }
}
