<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\System\Salutation\SalutationEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Personal — account type, name, birthday gates; Twig composes.
 */
#[AsTwigComponent]
class Personal
{
    public mixed $data = null;

    public mixed $salutations = null;

    public mixed $page = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    public mixed $accountType = null;

    public bool $hideCustomerTypeSelect = false;

    public bool $onlyCompanyRegistration = false;

    public ?bool $showBirthdayField = null;

    public bool $showVat = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showAccountType = false;

    public bool $showSalutation = false;

    public bool $showTitle = false;

    public bool $showBirthday = false;

    public bool $birthdayRequired = false;

    public bool $showCompany = false;

    public bool $companyAlways = false;

    public string $businessType = CustomerEntity::ACCOUNT_TYPE_BUSINESS;

    public string $privateType = CustomerEntity::ACCOUNT_TYPE_PRIVATE;

    public string $accountTypeValue = CustomerEntity::ACCOUNT_TYPE_PRIVATE;

    /**
     * @var list<array{value: string, label: string, selected?: bool, disabled?: bool}>
     */
    public array $accountTypeOptions = [];

    /**
     * @var list<array{value: string, label: string}>
     */
    public array $salutationOptions = [];

    /**
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    public array $fields = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
        $showAccountTypeConfig = (bool) $this->systemConfigService->get('core.loginRegistration.showAccountTypeSelection', $salesChannelId);

        $this->showSalutation = (bool) $this->systemConfigService->get('core.loginRegistration.showSalutation', $salesChannelId);
        $this->showTitle = (bool) $this->systemConfigService->get('core.loginRegistration.showTitleField', $salesChannelId);
        $this->showBirthday = $this->showBirthdayField ?? (bool) $this->systemConfigService->get('core.loginRegistration.showBirthdayField', $salesChannelId);
        $this->birthdayRequired = (bool) $this->systemConfigService->get('core.loginRegistration.birthdayFieldRequired', $salesChannelId);

        $this->showAccountType = !$this->hideCustomerTypeSelect && ($showAccountTypeConfig || $this->onlyCompanyRegistration);
        $this->companyAlways = $this->onlyCompanyRegistration;
        $this->showCompany = $this->showAccountType || $this->companyAlways;

        $resolvedType = $this->resolveAccountType();
        $this->accountTypeValue = $resolvedType;

        if ($this->showAccountType) {
            $this->accountTypeOptions = $this->buildAccountTypeOptions($resolvedType);
        }

        $this->salutations ??= ComponentData::pageSalutations($this->page);
        $this->salutationOptions = $this->buildSalutationOptions();
        $this->fields = $this->buildFields();
    }

    private function resolveAccountType(): string
    {
        if ($this->onlyCompanyRegistration) {
            return CustomerEntity::ACCOUNT_TYPE_BUSINESS;
        }

        $fromProp = \is_string($this->accountType) ? $this->accountType : null;
        $fromData = ComponentData::get($this->data, 'accountType');
        $company = ComponentData::get($this->data, 'company');

        if ($fromProp === CustomerEntity::ACCOUNT_TYPE_BUSINESS || $fromData === CustomerEntity::ACCOUNT_TYPE_BUSINESS || ComponentData::scalar($company) !== null) {
            return CustomerEntity::ACCOUNT_TYPE_BUSINESS;
        }

        if (\is_string($fromProp) && $fromProp !== '') {
            return $fromProp;
        }

        if (\is_string($fromData) && $fromData !== '') {
            return $fromData;
        }

        return CustomerEntity::ACCOUNT_TYPE_PRIVATE;
    }

    /**
     * @return list<array{value: string, label: string, selected?: bool, disabled?: bool}>
     */
    private function buildAccountTypeOptions(string $selected): array
    {
        $options = [];
        if (!$this->onlyCompanyRegistration) {
            $options[] = [
                'value' => CustomerEntity::ACCOUNT_TYPE_PRIVATE,
                'label' => $this->translator->trans('account.personalTypePrivate'),
                'selected' => $selected === CustomerEntity::ACCOUNT_TYPE_PRIVATE,
            ];
        }

        $options[] = [
            'value' => CustomerEntity::ACCOUNT_TYPE_BUSINESS,
            'label' => $this->translator->trans('account.personalTypeBusiness'),
            'selected' => $selected === CustomerEntity::ACCOUNT_TYPE_BUSINESS,
        ];

        return $options;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function buildSalutationOptions(): array
    {
        $options = [];
        if (!\is_iterable($this->salutations)) {
            return $options;
        }

        $selected = ComponentData::get($this->data, 'salutationId');
        foreach ($this->salutations as $salutation) {
            if (!$salutation instanceof SalutationEntity) {
                continue;
            }
            $id = $salutation->getId();
            $label = (string) ($salutation->getTranslation('displayName') ?? $salutation->getDisplayName() ?? $salutation->getTranslation('name') ?? $id);
            $options[] = [
                'value' => $id,
                'label' => $label,
                'selected' => $selected !== null && (string) $selected === $id,
            ];
        }

        return $options;
    }

    /**
     * @return array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    private function buildFields(): array
    {
        $birthday = $this->resolveBirthday();

        return [
            'accountType' => ComponentData::field($this->idPrefix, $this->prefix, 'accountType', 'accountType', $this->accountTypeValue),
            'salutation' => ComponentData::field($this->idPrefix, $this->prefix, 'personalSalutation', 'salutationId', ComponentData::get($this->data, 'salutationId')),
            'title' => ComponentData::field($this->idPrefix, $this->prefix, 'personalTitle', 'title', ComponentData::get($this->data, 'title')),
            'firstName' => ComponentData::field($this->idPrefix, $this->prefix, '-personalFirstName', 'firstName', ComponentData::get($this->data, 'firstName')),
            'lastName' => ComponentData::field($this->idPrefix, $this->prefix, '-personalLastName', 'lastName', ComponentData::get($this->data, 'lastName')),
            'birthdayDay' => ComponentData::field($this->idPrefix, $this->prefix, 'personalBirthday-day', 'birthdayDay', $birthday['day'], false),
            'birthdayMonth' => ComponentData::field($this->idPrefix, $this->prefix, 'personalBirthday-month', 'birthdayMonth', $birthday['month'], false),
            'birthdayYear' => ComponentData::field($this->idPrefix, $this->prefix, 'personalBirthday-year', 'birthdayYear', $birthday['year'], false),
        ];
    }

    /**
     * @return array{day: int|string|null, month: int|string|null, year: int|string|null}
     */
    private function resolveBirthday(): array
    {
        $day = ComponentData::get($this->data, 'birthdayDay');
        $month = ComponentData::get($this->data, 'birthdayMonth');
        $year = ComponentData::get($this->data, 'birthdayYear');
        if ($day !== null || $month !== null || $year !== null) {
            return ['day' => $day, 'month' => $month, 'year' => $year];
        }

        $birthday = ComponentData::get($this->data, 'birthday');
        if ($birthday instanceof \DateTimeInterface) {
            return [
                'day' => (int) $birthday->format('d'),
                'month' => (int) $birthday->format('m'),
                'year' => (int) $birthday->format('Y'),
            ];
        }

        return ['day' => null, 'month' => null, 'year' => null];
    }
}
