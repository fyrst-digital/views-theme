<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Checkout\Customer\CustomerEntity;
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
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string|null}>
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

        $this->salutationOptions = $this->buildSalutationOptions();
        $this->fields = $this->buildFields();
    }

    private function resolveAccountType(): string
    {
        if ($this->onlyCompanyRegistration) {
            return CustomerEntity::ACCOUNT_TYPE_BUSINESS;
        }

        $fromProp = \is_string($this->accountType) ? $this->accountType : null;
        $fromData = $this->bagValue($this->data, 'accountType');
        $company = $this->bagValue($this->data, 'company');

        if ($fromProp === CustomerEntity::ACCOUNT_TYPE_BUSINESS || $fromData === CustomerEntity::ACCOUNT_TYPE_BUSINESS || $this->nonEmpty($company) !== null) {
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
        $salutations = $this->salutations;
        if ($salutations === null && \is_object($this->page) && method_exists($this->page, 'getSalutations')) {
            $salutations = $this->page->getSalutations();
        }

        $options = [];
        if (!\is_iterable($salutations)) {
            return $options;
        }

        $selected = $this->bagValue($this->data, 'salutationId');
        foreach ($salutations as $salutation) {
            if (!\is_object($salutation) || !method_exists($salutation, 'getId')) {
                continue;
            }
            $id = (string) $salutation->getId();
            $label = method_exists($salutation, 'getTranslation')
                ? (string) ($salutation->getTranslation('displayName') ?? $salutation->getTranslation('name') ?? $id)
                : $id;
            $options[] = [
                'value' => $id,
                'label' => $label,
                'selected' => $selected !== null && (string) $selected === $id,
            ];
        }

        return $options;
    }

    /**
     * @return array<string, array{id: string, name: string, value: mixed, violationPath: string|null}>
     */
    private function buildFields(): array
    {
        $birthday = $this->resolveBirthday();

        return [
            'accountType' => $this->field('accountType', 'accountType', $this->accountTypeValue),
            'salutation' => $this->field('personalSalutation', 'salutationId', $this->bagValue($this->data, 'salutationId')),
            'title' => $this->field('personalTitle', 'title', $this->bagValue($this->data, 'title')),
            'firstName' => $this->field('-personalFirstName', 'firstName', $this->bagValue($this->data, 'firstName')),
            'lastName' => $this->field('-personalLastName', 'lastName', $this->bagValue($this->data, 'lastName')),
            'birthdayDay' => $this->field('personalBirthday-day', 'birthdayDay', $birthday['day'], false),
            'birthdayMonth' => $this->field('personalBirthday-month', 'birthdayMonth', $birthday['month'], false),
            'birthdayYear' => $this->field('personalBirthday-year', 'birthdayYear', $birthday['year'], false),
        ];
    }

    /**
     * @return array{day: int|string|null, month: int|string|null, year: int|string|null}
     */
    private function resolveBirthday(): array
    {
        $day = $this->bagValue($this->data, 'birthdayDay');
        $month = $this->bagValue($this->data, 'birthdayMonth');
        $year = $this->bagValue($this->data, 'birthdayYear');
        if ($day !== null || $month !== null || $year !== null) {
            return ['day' => $day, 'month' => $month, 'year' => $year];
        }

        $birthday = $this->bagValue($this->data, 'birthday');
        if ($birthday instanceof \DateTimeInterface) {
            return [
                'day' => (int) $birthday->format('d'),
                'month' => (int) $birthday->format('m'),
                'year' => (int) $birthday->format('Y'),
            ];
        }

        return ['day' => null, 'month' => null, 'year' => null];
    }

    /**
     * @return array{id: string, name: string, value: mixed, violationPath: string|null}
     */
    private function field(string $idSuffix, string $key, mixed $value, bool $prefixedName = true): array
    {
        $name = $prefixedName && $this->prefix !== '' ? $this->prefix . '[' . $key . ']' : $key;

        return [
            'id' => $this->idPrefix . $this->prefix . $idSuffix,
            'name' => $name,
            'value' => $value,
            'violationPath' => $this->prefix !== '' ? '/' . $this->prefix . '/' . $key : '/' . $key,
        ];
    }

    private function bagValue(mixed $data, string $key): mixed
    {
        if ($data === null) {
            return null;
        }

        if (\is_object($data) && method_exists($data, 'get')) {
            try {
                $value = $data->get($key);
                if ($value !== null) {
                    return $value;
                }
            } catch (\Throwable) {
            }
        }

        if (\is_object($data)) {
            $method = 'get' . ucfirst($key);
            if (method_exists($data, $method)) {
                return $data->{$method}();
            }
        }

        if (\is_array($data)) {
            return $data[$key] ?? null;
        }

        return null;
    }

    private function nonEmpty(mixed $value): ?string
    {
        if (!\is_string($value) && !is_numeric($value)) {
            return null;
        }

        $string = (string) $value;

        return $string !== '' ? $string : null;
    }
}
