<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Title — optional personal title.
 */
#[AsTwigComponent]
class Title
{
    public mixed $data = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string}
     */
    public array $field = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
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
        $this->visible = (bool) $this->systemConfigService->get('core.loginRegistration.showTitleField', $salesChannelId);
        $this->field = ComponentData::field(
            $this->idPrefix,
            $this->prefix,
            'personalTitle',
            'title',
            ComponentData::get($this->data, 'title'),
        );
    }
}
