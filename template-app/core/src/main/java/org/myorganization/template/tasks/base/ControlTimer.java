package org.myorganization.template.tasks.base;

import java.util.Timer;
import java.util.TimerTask;

public class ControlTimer {

	private Timer timer;
	
	private int period = 1000;
	
	private ControlTimerAction action;
	
	public ControlTimer(ControlTimerAction action, int period) {
		this.action = action;
		this.period = period;
	}

	public void start() {
		timer = new Timer();
		timer.scheduleAtFixedRate(new TimerTask(){
		   @Override
		   public void run(){
			   action.action();
		   }
		}, 0, this.period);
	}

	public void stop() {
		timer.cancel();
	}

}
