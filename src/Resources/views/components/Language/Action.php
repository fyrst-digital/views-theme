<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Language;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\System\Language\LanguageEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Language:Action — derivation lives here; Twig only composes.
 */
#[AsTwigComponent]
class Action
{
    public mixed $languages = [];

    public ?string $activeLanguageId = null;

    public ?string $id = null;

    public bool $showCode = false;

    public bool $showFlag = true;

    public string $placement = 'bottom-end';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public string $ariaName = '';

    public string $languageCode = '';

    public ?string $flagCode = null;

    public ?string $flagCodeFallback = null;

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $context = $this->salesChannelContextAccessor->get();

        $this->languages ??= [];
        $this->activeLanguageId ??= $context?->getLanguageId();
        $this->id ??= 'vi-language-action-' . bin2hex(random_bytes(4));

        $count = $this->countItems($this->languages);
        $this->visible = $count > 1;

        if (!$this->visible) {
            return;
        }

        $activeLanguage = $this->findActiveLanguage($this->languages, $this->activeLanguageId);
        if ($activeLanguage === null && $count > 0) {
            $activeLanguage = $this->firstItem($this->languages);
        }

        $languageInfoName = $context?->getLanguageInfo()->name ?? '';
        $languageInfoLocale = $context?->getLanguageInfo()->localeCode ?? null;

        $activeName = '';
        if ($activeLanguage instanceof LanguageEntity) {
            $translated = $activeLanguage->getTranslation('name');
            $activeName = \is_string($translated) && $translated !== ''
                ? $translated
                : $activeLanguage->getName();
        } elseif ($activeLanguage instanceof Entity) {
            $activeName = (string) ($activeLanguage->get('name') ?? '');
        }

        $this->ariaName = $languageInfoName !== '' ? $languageInfoName : $activeName;

        $activeTranslationCode = null;
        if ($activeLanguage instanceof LanguageEntity) {
            $locale = $activeLanguage->getTranslationCode();
            $activeTranslationCode = $locale?->getCode();
        }
        if ($activeTranslationCode === null || $activeTranslationCode === '') {
            $activeTranslationCode = $languageInfoLocale;
        }

        if (\is_string($activeTranslationCode) && $activeTranslationCode !== '') {
            $this->flagCode = $activeTranslationCode;
            $parts = explode('-', strtolower($activeTranslationCode));
            $this->languageCode = strtoupper($parts[0] ?? '');
            $fallback = $parts[0] ?? null;
            $this->flagCodeFallback = $fallback !== null && $fallback !== strtolower($activeTranslationCode)
                ? $fallback
                : null;
        }
    }


    private function countItems(mixed $items): int
    {
        if ($items instanceof EntityCollection) {
            return $items->count();
        }

        if (\is_countable($items)) {
            return \count($items);
        }

        return 0;
    }

    private function findActiveLanguage(mixed $items, ?string $activeId): mixed
    {
        if ($activeId === null || $items === null) {
            return null;
        }

        if ($items instanceof EntityCollection) {
            $found = $items->get($activeId);

            return $found;
        }

        if (!is_iterable($items)) {
            return null;
        }

        foreach ($items as $item) {
            if ($item instanceof Entity && $item->getUniqueIdentifier() === $activeId) {
                return $item;
            }
            if (\is_array($item) && ($item['id'] ?? null) === $activeId) {
                return $item;
            }
        }

        return null;
    }

    private function firstItem(mixed $items): mixed
    {
        if ($items instanceof EntityCollection) {
            return $items->first();
        }

        if (!is_iterable($items)) {
            return null;
        }

        foreach ($items as $item) {
            return $item;
        }

        return null;
    }
}
