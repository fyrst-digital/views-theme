<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\Country\CountryEntity;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Country — country and state row, plus per-option address flags.
 */
#[AsTwigComponent]
class Country
{
    public mixed $data = null;

    public mixed $countries = null;

    public mixed $page = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    public bool $showNoShippingPostfix = false;

    public bool $disableNonShippableCountries = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $stateDisplayed = false;

    /**
     * @var list<array{value: string, label: string, disabled?: bool, selected?: bool, zipRequired?: bool, stateRequired?: bool, vatRequired?: bool, stateDisplayed?: bool}>
     */
    public array $options = [];

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}
     */
    public array $field = [];

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}
     */
    public array $state = [];

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly TranslatorInterface $translator,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );
        $this->countries ??= ComponentData::pageCountries($this->page);

        $countryId = $this->resolveCountryId();
        $this->options = $this->buildOptions($countryId);
        $this->stateDisplayed = $this->selectedStateDisplayed($countryId);
        $auto = ComponentData::addressAutocompletePrefix($this->prefix);
        $this->field = ComponentData::field(
            $this->idPrefix,
            $this->prefix,
            'AddressCountry',
            'countryId',
            $countryId,
            true,
            $auto . 'country-name',
        );
        $this->state = ComponentData::field(
            $this->idPrefix,
            $this->prefix,
            'AddressCountryState',
            'countryStateId',
            ComponentData::scalar(ComponentData::get($this->data, 'countryStateId')),
            true,
            $auto . 'address-level1',
        );
    }

    private function selectedStateDisplayed(?string $countryId): bool
    {
        if ($countryId === null) {
            return false;
        }

        foreach ($this->options as $option) {
            if (($option['value'] ?? '') === $countryId) {
                return (bool) ($option['stateDisplayed'] ?? false);
            }
        }

        return false;
    }

    private function resolveCountryId(): ?string
    {
        $fromData = ComponentData::scalar(ComponentData::get($this->data, 'countryId'));
        if ($fromData !== null) {
            return $fromData;
        }

        $context = $this->salesChannelContextAccessor->get();
        $channelCountryId = $context?->getSalesChannel()?->getCountryId();
        if (\is_string($channelCountryId) && $channelCountryId !== '') {
            return $channelCountryId;
        }

        if (!\is_iterable($this->countries)) {
            return null;
        }

        $ids = [];
        foreach ($this->countries as $country) {
            if ($country instanceof CountryEntity) {
                $ids[] = $country->getId();
            }
        }

        return \count($ids) === 1 ? $ids[0] : null;
    }

    /**
     * @return list<array{value: string, label: string, disabled?: bool, selected?: bool, zipRequired?: bool, stateRequired?: bool, vatRequired?: bool, stateDisplayed?: bool}>
     */
    private function buildOptions(?string $countryId): array
    {
        $options = [];

        if ($countryId === null) {
            $options[] = [
                'value' => '',
                'label' => $this->translator->trans('address.countryPlaceholder'),
                'disabled' => true,
                'selected' => true,
            ];
        }

        if (!\is_iterable($this->countries)) {
            return $options;
        }

        $noShipping = $this->translator->trans('address.countryPostfixNoShipping');

        foreach ($this->countries as $country) {
            if (!$country instanceof CountryEntity) {
                continue;
            }

            $id = $country->getId();
            $label = (string) ($country->getTranslation('name') ?? $country->getName() ?? $id);
            $shippingAvailable = $country->getShippingAvailable();
            if ($this->showNoShippingPostfix && !$shippingAvailable) {
                $label .= ' ' . $noShipping;
            }

            $options[] = [
                'value' => $id,
                'label' => $label,
                'disabled' => $this->disableNonShippableCountries && !$shippingAvailable,
                'zipRequired' => $country->getPostalCodeRequired(),
                'stateRequired' => $country->getForceStateInRegistration(),
                'vatRequired' => $country->getVatIdRequired(),
                'stateDisplayed' => $country->getDisplayStateInRegistration(),
            ];
        }

        return $options;
    }
}
