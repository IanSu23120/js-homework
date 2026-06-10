import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('planner', '0002_expense_schedule_item'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ScheduleItemComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='schedule_item_comments', to=settings.AUTH_USER_MODEL)),
                ('schedule_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='planner.scheduleitem')),
            ],
        ),
    ]
