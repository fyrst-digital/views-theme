<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Form — field layout, country flags, visibility; Twig composes.
 */
#[AsTwigComponent]
class Form
{
    public mixed $data = null;

    public mixed $countries = null;

    public mixed $page = null;

    public mixed $formViolations = null;

    public string $prefix = 'address';

    public string $idPrefix = '';

    public bool $showNoShippingPostfix = false;

    public bool $disableNonShippableCountries = false;

    public ?string $vatInputId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showAdditional1 = false;

    public bool $showAdditional2 = false;

    public bool $additional1Required = false;

    public bool $additional2Required = false;

    public bool $showPhone = false;

    public bool $phoneRequired = false;

    /**
     * @var list<string>
     */
    public array $arrangement = ['city', 'state', 'zip'];

    /**
     * @var list<array<string, mixed>>
     */
    public array $countryOptions = [];

    /**
     * @var array<string, array{requiredZip: bool, requiredState: bool, requiredVat: bool, displayState: bool}>
     */
    public array $countryFlags = [];

    public ?string $countryId = null;

    public ?string $countryStateId = null;

    /**
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    public array $fields = [];

    public string $countrySelectId = '';

    public string $stateSelectId = '';

    public string $zipInputId = '';

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
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
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );

        $this->showAdditional1 = (bool) $this->systemConfigService->get('core.loginRegistration.showAdditionalAddressField1', $salesChannelId);
        $this->showAdditional2 = (bool) $this->systemConfigService->get('core.loginRegistration.showAdditionalAddressField2', $salesChannelId);
        $this->additional1Required = (bool) $this->systemConfigService->get('core.loginRegistration.additionalAddressField1Required', $salesChannelId);
        $this->additional2Required = (bool) $this->systemConfigService->get('core.loginRegistration.additionalAddressField2Required', $salesChannelId);
        $this->showPhone = (bool) $this->systemConfigService->get('core.loginRegistration.showPhoneNumberField', $salesChannelId);
        $this->phoneRequired = (bool) $this->systemConfigService->get('core.loginRegistration.phoneNumberFieldRequired', $salesChannelId);

        $arrangement = $this->systemConfigService->get('core.loginRegistration.addressInputFieldArrangement', $salesChannelId);
        if (\is_string($arrangement) && $arrangement !== '') {
            $this->arrangement = array_values(array_filter(
                explode('-', $arrangement),
                static fn (string $part): bool => \in_array($part, ['city', 'state', 'zip'], true),
            ));
        }
        if ($this->arrangement === []) {
            $this->arrangement = ['city', 'state', 'zip'];
        }

        $this->countries ??= ComponentData::pageCountries($this->page);

        $this->countryId = $this->resolveCountryId();
        $this->countryStateId = ComponentData::scalar(ComponentData::get($this->data, 'countryStateId'));
        $this->buildCountryOptions();

        $this->countrySelectId = $this->idPrefix . $this->prefix . 'AddressCountry';
        $this->stateSelectId = $this->idPrefix . $this->prefix . 'AddressCountryState';
        $this->zipInputId = $this->idPrefix . $this->prefix . 'AddressZipcode';

        $this->fields = $this->buildFields();
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

    private function buildCountryOptions(): void
    {
        $this->countryOptions = [];
        $this->countryFlags = [];

        if ($this->countryId === null) {
            $this->countryOptions[] = [
                'value' => '',
                'label' => $this->translator->trans('address.countryPlaceholder'),
                'disabled' => true,
                'selected' => true,
            ];
        }

        if (!\is_iterable($this->countries)) {
            return;
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

            $this->countryFlags[$id] = [
                'requiredZip' => $country->getPostalCodeRequired(),
                'requiredState' => $country->getForceStateInRegistration(),
                'requiredVat' => (bool) $country->getVatIdRequired(),
                'displayState' => $country->getDisplayStateInRegistration(),
            ];

            $this->countryOptions[] = [
                'value' => $id,
                'label' => $label,
                'disabled' => $this->disableNonShippableCountries && !$shippingAvailable,
                'selected' => $this->countryId === $id,
            ];
        }
    }

    /**
     * @return array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    private function buildFields(): array
    {
        $auto = $this->autocompletePrefix();

        return [
            'street' => ComponentData::field($this->idPrefix, $this->prefix, '-AddressStreet', 'street', ComponentData::get($this->data, 'street'), true, $auto . 'address-line1'),
            'additionalAddressLine1' => ComponentData::field($this->idPrefix, $this->prefix, 'AdditionalField1', 'additionalAddressLine1', ComponentData::get($this->data, 'additionalAddressLine1'), true, $auto . 'address-line2'),
            'additionalAddressLine2' => ComponentData::field($this->idPrefix, $this->prefix, 'AdditionalField2', 'additionalAddressLine2', ComponentData::get($this->data, 'additionalAddressLine2'), true, $auto . 'address-line3'),
            'city' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressCity', 'city', ComponentData::get($this->data, 'city'), true, $auto . 'address-level2'),
            'zipcode' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressZipcode', 'zipcode', ComponentData::get($this->data, 'zipcode'), true, $auto . 'postal-code'),
            'country' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressCountry', 'countryId', $this->countryId, true, $auto . 'country-name'),
            'countryState' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressCountryState', 'countryStateId', $this->countryStateId, true, $auto . 'address-level1'),
            'phoneNumber' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressPhoneNumber', 'phoneNumber', ComponentData::get($this->data, 'phoneNumber'), true, $auto . 'tel'),
        ];
    }

    private function autocompletePrefix(): string
    {
        if ($this->prefix === 'shippingAddress') {
            return 'shipping ';
        }
        if ($this->prefix === 'billingAddress') {
            return 'billing ';
        }

        return '';
    }
}
