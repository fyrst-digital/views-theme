<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Struct;

use Fyrst\ViewsTheme\Struct\ConfiguratorOptionFace;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Content\Product\Aggregate\ProductConfiguratorSetting\ProductConfiguratorSettingEntity;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupEntity;

final class ConfiguratorOptionFaceTest extends TestCase
{
    public function testTextOption(): void
    {
        $option = $this->option();
        $option->setTranslated(['name' => 'Rot']);

        $face = ConfiguratorOptionFace::from($option, $this->group('text'));

        self::assertSame(ConfiguratorOptionFace::TEXT, $face->kind);
        self::assertSame('Rot', $face->name);
        self::assertNull($face->colorHex);
        self::assertNull($face->media);
        self::assertFalse($face->hidesName());
    }

    public function testColorOptionHidesNameOnlyWhenHexIsSet(): void
    {
        $withHex = $this->option();
        $withHex->setColorHexCode('#00ff00');
        $face = ConfiguratorOptionFace::from($withHex, $this->group('color'));

        self::assertSame(ConfiguratorOptionFace::COLOR, $face->kind);
        self::assertSame('#00ff00', $face->colorHex);
        self::assertTrue($face->hidesName());

        $withoutHex = ConfiguratorOptionFace::from($this->option(), $this->group('color'));

        self::assertSame(ConfiguratorOptionFace::COLOR, $withoutHex->kind);
        self::assertNull($withoutHex->colorHex);
        self::assertFalse($withoutHex->hidesName());
    }

    public function testMediaOptionWithoutFileKeepsTheNameVisible(): void
    {
        $face = ConfiguratorOptionFace::from($this->option(), $this->group('media'));

        self::assertSame(ConfiguratorOptionFace::MEDIA, $face->kind);
        self::assertNull($face->media);
        self::assertFalse($face->hidesName());
    }

    public function testMediaOptionUsesOptionMedia(): void
    {
        $media = new MediaEntity();
        $media->setId('option-media');
        $option = $this->option();
        $option->setMedia($media);

        $face = ConfiguratorOptionFace::from($option, $this->group('media'));

        self::assertSame($media, $face->media);
        self::assertTrue($face->hidesName());
    }

    public function testConfiguratorSettingMediaOverridesGroupType(): void
    {
        $optionMedia = new MediaEntity();
        $optionMedia->setId('option-media');
        $settingMedia = new MediaEntity();
        $settingMedia->setId('setting-media');

        $setting = new ProductConfiguratorSettingEntity();
        $setting->setMedia($settingMedia);

        $option = $this->option();
        $option->setColorHexCode('#ff0000');
        $option->setMedia($optionMedia);
        $option->setConfiguratorSetting($setting);

        $face = ConfiguratorOptionFace::from($option, $this->group('color'));

        self::assertSame(ConfiguratorOptionFace::MEDIA, $face->kind);
        self::assertSame($settingMedia, $face->media);
        self::assertNull($face->colorHex);
        self::assertTrue($face->hidesName());
    }

    public function testLegacyAndUnknownGroupTypesAreText(): void
    {
        foreach (['image', 'custom', '', 'select'] as $raw) {
            $face = ConfiguratorOptionFace::from($this->option(), $this->group($raw));

            self::assertSame(ConfiguratorOptionFace::TEXT, $face->kind);
            self::assertFalse($face->hidesName());
        }
    }

    private function group(string $displayType): PropertyGroupEntity
    {
        $group = new PropertyGroupEntity();
        $group->setId('group-1');
        $group->setDisplayType($displayType);

        return $group;
    }

    private function option(): PropertyGroupOptionEntity
    {
        $option = new PropertyGroupOptionEntity();
        $option->setId('option-1');
        $option->setName('Red');
        $option->setCombinable(true);

        return $option;
    }
}
