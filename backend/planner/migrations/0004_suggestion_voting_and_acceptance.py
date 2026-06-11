import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('planner', '0003_scheduleitemcomment'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='suggestion',
            name='accepted_schedule_item',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='source_suggestion',
                to='planner.scheduleitem',
            ),
        ),
        migrations.AddField(
            model_name='suggestion',
            name='lat',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='suggestion',
            name='lng',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='suggestion',
            name='voters',
            field=models.ManyToManyField(
                blank=True,
                related_name='voted_suggestions',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
