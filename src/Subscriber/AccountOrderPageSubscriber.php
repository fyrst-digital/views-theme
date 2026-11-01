<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Fyrst\ViewsTheme\Struct\OrderHistoryPeriod;
use Shopware\Core\Checkout\Order\OrderStates;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\RangeFilter;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Core\System\StateMachine\Aggregation\StateMachineState\StateMachineStateCollection;
use Shopware\Core\System\StateMachine\Aggregation\StateMachineState\StateMachineStateEntity;
use Shopware\Storefront\Event\RouteRequest\OrderRouteRequestEvent;
use Shopware\Storefront\Page\Account\Order\AccountOrderPageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Order history filters (`status` = order state technical name, `period` = months back).
 * Applies them to the core order route criteria and hands the selection plus the available
 * states to `Account:Orders:Filter` as `page.extensions.viewsTheme.orderFilter`.
 */
class AccountOrderPageSubscriber implements EventSubscriberInterface
{
    public const STATUS_PARAM = 'status';

    /**
     * @var list<string>
     */
    private const STATE_ORDER = [
        OrderStates::STATE_OPEN,
        OrderStates::STATE_IN_PROGRESS,
        OrderStates::STATE_COMPLETED,
        OrderStates::STATE_CANCELLED,
    ];

    /**
     * @var list<array{technicalName: string, name: string}>|null
     */
    private ?array $states = null;

    /**
     * @param EntityRepository<StateMachineStateCollection> $stateRepository
     */
    public function __construct(
        private readonly EntityRepository $stateRepository,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            OrderRouteRequestEvent::class => 'onOrderRouteRequest',
            AccountOrderPageLoadedEvent::class => 'onPageLoaded',
        ];
    }

    public function onOrderRouteRequest(OrderRouteRequestEvent $event): void
    {
        $request = $event->getStorefrontRequest();
        $context = $event->getContext();
        $criteria = $event->getCriteria();

        $query = $request->query->all();

        $status = $this->status($query[self::STATUS_PARAM] ?? null, $context);
        if ($status !== null) {
            $criteria->addFilter(new EqualsFilter('stateMachineState.technicalName', $status));
        }

        $period = OrderHistoryPeriod::fromQuery($query[OrderHistoryPeriod::QUERY_PARAM] ?? null);
        if ($period !== null) {
            $criteria->addFilter(new RangeFilter('orderDateTime', [
                RangeFilter::GTE => $period->since()->format(Defaults::STORAGE_DATE_TIME_FORMAT),
            ]));
        }
    }

    public function onPageLoaded(AccountOrderPageLoadedEvent $event): void
    {
        $query = $event->getRequest()->query->all();
        $context = $event->getContext();

        $event->getPage()->addExtension('viewsTheme', new ArrayStruct([
            'orderFilter' => new ArrayStruct([
                'states' => $this->states($context),
                'status' => $this->status($query[self::STATUS_PARAM] ?? null, $context),
                'period' => OrderHistoryPeriod::fromQuery($query[OrderHistoryPeriod::QUERY_PARAM] ?? null)?->value,
            ]),
        ]));
    }

    /**
     * Unknown states are ignored (no filter), so a stale or hand-edited URL never empties the list.
     */
    private function status(mixed $value, Context $context): ?string
    {
        if (!\is_string($value) || $value === '') {
            return null;
        }

        foreach ($this->states($context) as $state) {
            if ($state['technicalName'] === $value) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @return list<array{technicalName: string, name: string}>
     */
    private function states(Context $context): array
    {
        if ($this->states !== null) {
            return $this->states;
        }

        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('stateMachine.technicalName', OrderStates::STATE_MACHINE));

        $states = [];
        foreach ($this->stateRepository->search($criteria, $context)->getEntities() as $state) {
            if (!$state instanceof StateMachineStateEntity) {
                continue;
            }

            $name = $state->getTranslation('name');
            $states[] = [
                'technicalName' => $state->getTechnicalName(),
                'name' => \is_string($name) && $name !== '' ? $name : $state->getTechnicalName(),
            ];
        }

        usort($states, static function (array $a, array $b): int {
            $rank = static fn (string $technicalName): int => ($index = array_search($technicalName, self::STATE_ORDER, true)) === false
                ? \count(self::STATE_ORDER)
                : $index;

            return $rank($a['technicalName']) <=> $rank($b['technicalName']);
        });

        return $this->states = $states;
    }
}
