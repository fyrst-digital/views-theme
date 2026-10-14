<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme;

use Shopware\Core\Framework\Plugin;
use Shopware\Storefront\Framework\ThemeInterface;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;

class ViewsTheme extends Plugin implements ThemeInterface
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        if ($container->getParameter('kernel.environment') !== 'dev') {
            return;
        }

        $loader = new XmlFileLoader($container, new FileLocator(__DIR__ . '/Resources/config'));
        $loader->load('services_dev.xml');
    }
}
